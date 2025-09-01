import { MultiDeviceRunner } from '@/multi-device-runner.js';
import { LoadTestConfig, LifecycleTestConfig } from '@/types/index.js';
import { createDeviceLogger } from '@/utils/logger.js';
import { config } from '@/config/index.js';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

const logger = createDeviceLogger('performance-test', 'test');

interface PerformanceMetrics {
  testType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  deviceCount: number;
  totalMessages: number;
  messagesPerSecond: number;
  successRate: number;
  errors: string[];
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
  };
  cpuUsage: {
    initial: NodeJS.CpuUsage;
    final: NodeJS.CpuUsage;
  };
}

interface TestScenario {
  name: string;
  description: string;
  config: LoadTestConfig | LifecycleTestConfig;
  type: 'load' | 'lifecycle' | 'stress' | 'endurance';
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'basic_load',
    description: 'Basic load test with 20 devices for 5 minutes',
    type: 'load',
    config: {
      duration: 300000, // 5 minutes
      rampUpTime: 30000, // 30 seconds
      maxDevices: 20,
      messageRate: 10,
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'basic'
    } as LoadTestConfig
  },
  {
    name: 'high_load',
    description: 'High load test with 100 devices for 10 minutes',
    type: 'load',
    config: {
      duration: 600000, // 10 minutes
      rampUpTime: 60000, // 1 minute
      maxDevices: 100,
      messageRate: 20,
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'stress'
    } as LoadTestConfig
  },
  {
    name: 'stress_test',
    description: 'Stress test with 200 devices for 15 minutes',
    type: 'stress',
    config: {
      duration: 900000, // 15 minutes
      rampUpTime: 120000, // 2 minutes
      maxDevices: 200,
      messageRate: 50,
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'stress'
    } as LoadTestConfig
  },
  {
    name: 'endurance_test',
    description: 'Endurance test with 50 devices for 2 hours',
    type: 'endurance',
    config: {
      duration: 7200000, // 2 hours
      rampUpTime: 300000, // 5 minutes
      maxDevices: 50,
      messageRate: 5,
      deviceTypes: ['button', 'watch', 'repeater'],
      scenario: 'endurance'
    } as LoadTestConfig
  },
  {
    name: 'lifecycle_basic',
    description: 'Basic device lifecycle test - 10 cycles',
    type: 'lifecycle',
    config: {
      cycles: 10,
      connectDuration: 60000, // 1 minute
      disconnectDuration: 10000, // 10 seconds
      deviceCount: 20,
      validateMessages: true
    } as LifecycleTestConfig
  },
  {
    name: 'lifecycle_stress',
    description: 'Stress lifecycle test - 50 cycles with 100 devices',
    type: 'lifecycle',
    config: {
      cycles: 50,
      connectDuration: 30000, // 30 seconds
      disconnectDuration: 5000, // 5 seconds
      deviceCount: 100,
      validateMessages: true
    } as LifecycleTestConfig
  }
];

export class PerformanceTester {
  private runner: MultiDeviceRunner;
  private metrics: PerformanceMetrics | null = null;
  private startTime: Date | null = null;
  private messageCount = 0;
  private errorCount = 0;
  private errors: string[] = [];
  
  constructor() {
    this.runner = new MultiDeviceRunner();
  }
  
  /**
   * Run a specific test scenario
   */
  async runScenario(scenarioName: string): Promise<PerformanceMetrics> {
    const scenario = TEST_SCENARIOS.find(s => s.name === scenarioName);
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
    
    logger.info(`Starting performance test scenario: ${scenario.name}`, {
      description: scenario.description,
      type: scenario.type
    });
    
    this.startTime = new Date();
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();
    
    let peakMemory = initialMemory;
    
    // Monitor memory usage during test
    const memoryMonitor = setInterval(() => {
      const current = process.memoryUsage();
      if (current.heapUsed > peakMemory.heapUsed) {
        peakMemory = current;
      }
    }, 1000);
    
    try {
      if (scenario.type === 'lifecycle') {
        await this.runner.runLifecycleTest(scenario.config as LifecycleTestConfig);
      } else {
        await this.runner.runLoadTest(scenario.config as LoadTestConfig);
      }
      
      clearInterval(memoryMonitor);
      
      const endTime = new Date();
      const finalMemory = process.memoryUsage();
      const finalCpu = process.cpuUsage(initialCpu);
      
      const duration = endTime.getTime() - this.startTime.getTime();
      const deviceCount = this.getDeviceCount(scenario.config);
      
      this.metrics = {
        testType: scenario.name,
        startTime: this.startTime,
        endTime,
        duration,
        deviceCount,
        totalMessages: this.messageCount,
        messagesPerSecond: this.messageCount / (duration / 1000),
        successRate: this.errorCount === 0 ? 100 : ((this.messageCount - this.errorCount) / this.messageCount) * 100,
        errors: this.errors,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory
        },
        cpuUsage: {
          initial: { user: 0, system: 0 },
          final: finalCpu
        }
      };
      
      logger.info(`Performance test completed: ${scenario.name}`, {
        duration: duration / 1000,
        deviceCount,
        messagesPerSecond: this.metrics.messagesPerSecond,
        successRate: this.metrics.successRate
      });
      
      return this.metrics;
      
    } catch (error) {
      clearInterval(memoryMonitor);
      logger.error(`Performance test failed: ${scenario.name}`, error);
      throw error;
    }
  }
  
  /**
   * Run all test scenarios
   */
  async runAllScenarios(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = [];
    
    for (const scenario of TEST_SCENARIOS) {
      logger.info(`Running scenario ${scenario.name}...`);
      
      try {
        const result = await this.runScenario(scenario.name);
        results.push(result);
        
        // Wait between tests to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        logger.error(`Scenario ${scenario.name} failed`, error);
        // Continue with next scenario
      }
    }
    
    return results;
  }
  
  /**
   * Run custom load test
   */
  async runCustomLoadTest(config: LoadTestConfig): Promise<PerformanceMetrics> {
    logger.info('Starting custom load test', config);
    
    this.startTime = new Date();
    const initialMemory = process.memoryUsage();
    const initialCpu = process.cpuUsage();
    
    let peakMemory = initialMemory;
    const memoryMonitor = setInterval(() => {
      const current = process.memoryUsage();
      if (current.heapUsed > peakMemory.heapUsed) {
        peakMemory = current;
      }
    }, 1000);
    
    try {
      await this.runner.runLoadTest(config);
      
      clearInterval(memoryMonitor);
      
      const endTime = new Date();
      const finalMemory = process.memoryUsage();
      const finalCpu = process.cpuUsage(initialCpu);
      
      const duration = endTime.getTime() - this.startTime.getTime();
      
      this.metrics = {
        testType: 'custom_load',
        startTime: this.startTime,
        endTime,
        duration,
        deviceCount: config.maxDevices,
        totalMessages: this.messageCount,
        messagesPerSecond: this.messageCount / (duration / 1000),
        successRate: this.errorCount === 0 ? 100 : ((this.messageCount - this.errorCount) / this.messageCount) * 100,
        errors: this.errors,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory
        },
        cpuUsage: {
          initial: { user: 0, system: 0 },
          final: finalCpu
        }
      };
      
      return this.metrics;
      
    } catch (error) {
      clearInterval(memoryMonitor);
      throw error;
    }
  }
  
  /**
   * Generate performance report
   */
  async generateReport(results: PerformanceMetrics[]): Promise<string> {
    const reportLines: string[] = [];
    
    reportLines.push('# OBEDIO Device Simulator Performance Test Report');
    reportLines.push('');
    reportLines.push(`Generated: ${new Date().toISOString()}`);
    reportLines.push(`Total Tests: ${results.length}`);
    reportLines.push('');
    
    // Summary table
    reportLines.push('## Test Summary');
    reportLines.push('');
    reportLines.push('| Test | Duration | Devices | Messages | Msg/sec | Success Rate | Memory Peak |');
    reportLines.push('|------|----------|---------|----------|---------|--------------|-------------|');
    
    for (const result of results) {
      const duration = (result.duration / 1000).toFixed(1);
      const memoryMB = (result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(1);
      const msgPerSec = result.messagesPerSecond.toFixed(1);
      const successRate = result.successRate.toFixed(1);
      
      reportLines.push(
        `| ${result.testType} | ${duration}s | ${result.deviceCount} | ${result.totalMessages} | ${msgPerSec} | ${successRate}% | ${memoryMB}MB |`
      );
    }
    
    reportLines.push('');
    
    // Detailed results
    reportLines.push('## Detailed Results');
    reportLines.push('');
    
    for (const result of results) {
      reportLines.push(`### ${result.testType}`);
      reportLines.push('');
      reportLines.push(`**Duration**: ${(result.duration / 1000).toFixed(1)} seconds`);
      reportLines.push(`**Device Count**: ${result.deviceCount}`);
      reportLines.push(`**Total Messages**: ${result.totalMessages}`);
      reportLines.push(`**Messages/Second**: ${result.messagesPerSecond.toFixed(2)}`);
      reportLines.push(`**Success Rate**: ${result.successRate.toFixed(2)}%`);
      reportLines.push('');
      
      // Memory usage
      reportLines.push('**Memory Usage**:');
      reportLines.push(`- Initial: ${(result.memoryUsage.initial.heapUsed / 1024 / 1024).toFixed(1)}MB`);
      reportLines.push(`- Peak: ${(result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(1)}MB`);
      reportLines.push(`- Final: ${(result.memoryUsage.final.heapUsed / 1024 / 1024).toFixed(1)}MB`);
      reportLines.push('');
      
      // CPU usage
      reportLines.push('**CPU Usage**:');
      reportLines.push(`- User: ${(result.cpuUsage.final.user / 1000).toFixed(2)}ms`);
      reportLines.push(`- System: ${(result.cpuUsage.final.system / 1000).toFixed(2)}ms`);
      reportLines.push('');
      
      // Errors
      if (result.errors.length > 0) {
        reportLines.push('**Errors**:');
        result.errors.forEach(error => {
          reportLines.push(`- ${error}`);
        });
        reportLines.push('');
      }
      
      reportLines.push('---');
      reportLines.push('');
    }
    
    return reportLines.join('\n');
  }
  
  /**
   * Save report to file
   */
  async saveReport(results: PerformanceMetrics[], filename?: string): Promise<string> {
    const report = await this.generateReport(results);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = filename || `performance-report-${timestamp}.md`;
    const reportPath = path.join(process.cwd(), 'logs', reportFile);
    
    // Ensure logs directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    await fs.writeFile(reportPath, report, 'utf8');
    
    logger.info(`Performance report saved to ${reportPath}`);
    return reportPath;
  }
  
  /**
   * Get device count from config
   */
  private getDeviceCount(config: LoadTestConfig | LifecycleTestConfig): number {
    if ('maxDevices' in config) {
      return config.maxDevices;
    }
    return config.deviceCount;
  }
  
  /**
   * List available test scenarios
   */
  static listScenarios(): TestScenario[] {
    return TEST_SCENARIOS;
  }
}

// CLI interface
const program = new Command();

program
  .name('performance-test')
  .description('OBEDIO Device Simulator Performance Testing')
  .version('1.0.0');

program
  .command('list')
  .description('List available test scenarios')
  .action(() => {
    console.log('\n📋 Available Test Scenarios:\n');
    
    PerformanceTester.listScenarios().forEach(scenario => {
      console.log(`🔸 ${scenario.name}`);
      console.log(`   Type: ${scenario.type}`);
      console.log(`   Description: ${scenario.description}`);
      
      if ('maxDevices' in scenario.config) {
        const config = scenario.config as LoadTestConfig;
        console.log(`   Devices: ${config.maxDevices}, Duration: ${config.duration / 1000}s`);
      } else {
        const config = scenario.config as LifecycleTestConfig;
        console.log(`   Devices: ${config.deviceCount}, Cycles: ${config.cycles}`);
      }
      console.log('');
    });
  });

program
  .command('run')
  .description('Run a specific test scenario')
  .argument('<scenario>', 'Scenario name to run')
  .option('-r, --report <filename>', 'Save report to specific filename')
  .action(async (scenario, options) => {
    const tester = new PerformanceTester();
    
    try {
      console.log(`🚀 Starting performance test: ${scenario}\n`);
      
      const result = await tester.runScenario(scenario);
      
      console.log('\n✅ Test completed successfully!');
      console.log('\n📊 Results:');
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)} seconds`);
      console.log(`   Devices: ${result.deviceCount}`);
      console.log(`   Messages: ${result.totalMessages}`);
      console.log(`   Messages/sec: ${result.messagesPerSecond.toFixed(2)}`);
      console.log(`   Success Rate: ${result.successRate.toFixed(2)}%`);
      console.log(`   Memory Peak: ${(result.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(1)}MB`);
      
      if (options.report) {
        const reportPath = await tester.saveReport([result], options.report);
        console.log(`\n📄 Report saved to: ${reportPath}`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  });

program
  .command('run-all')
  .description('Run all test scenarios')
  .option('-r, --report <filename>', 'Save report to specific filename')
  .action(async (options) => {
    const tester = new PerformanceTester();
    
    try {
      console.log('🚀 Starting all performance tests...\n');
      
      const results = await tester.runAllScenarios();
      
      console.log('\n✅ All tests completed!');
      console.log(`\n📊 Summary: ${results.length} tests completed`);
      
      const reportPath = await tester.saveReport(results, options.report);
      console.log(`\n📄 Report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    }
  });

program
  .command('custom')
  .description('Run custom load test')
  .option('-d, --duration <ms>', 'Test duration in milliseconds', '300000')
  .option('-m, --max-devices <count>', 'Maximum number of devices', '50')
  .option('-t, --types <types>', 'Device types (comma-separated)', 'button,watch,repeater')
  .option('-r, --report <filename>', 'Save report to specific filename')
  .action(async (options) => {
    const tester = new PerformanceTester();
    
    const config: LoadTestConfig = {
      duration: parseInt(options.duration),
      rampUpTime: Math.min(60000, parseInt(options.duration) / 10),
      maxDevices: parseInt(options.maxDevices),
      messageRate: 10,
      deviceTypes: options.types.split(',') as Array<'button' | 'watch' | 'repeater'>,
      scenario: 'basic'
    };
    
    try {
      console.log('🚀 Starting custom load test...\n');
      console.log('⚙️  Configuration:', {
        duration: `${config.duration / 1000}s`,
        maxDevices: config.maxDevices,
        deviceTypes: config.deviceTypes
      });
      
      const result = await tester.runCustomLoadTest(config);
      
      console.log('\n✅ Custom test completed!');
      console.log('\n📊 Results:');
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)} seconds`);
      console.log(`   Devices: ${result.deviceCount}`);
      console.log(`   Messages: ${result.totalMessages}`);
      console.log(`   Messages/sec: ${result.messagesPerSecond.toFixed(2)}`);
      console.log(`   Success Rate: ${result.successRate.toFixed(2)}%`);
      
      if (options.report) {
        const reportPath = await tester.saveReport([result], options.report);
        console.log(`\n📄 Report saved to: ${reportPath}`);
      }
      
    } catch (error) {
      console.error('❌ Custom test failed:', error);
      process.exit(1);
    }
  });

// Export for use as module - PerformanceTester already exported above
export { TEST_SCENARIOS };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}